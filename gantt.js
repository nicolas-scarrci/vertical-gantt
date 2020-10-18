$.ganttdata = {
    tmp:{}
}
$.gantt = function(){
    function outline(){
        return {
            projects:{},
            resources:[],
            timeslots:[],
            assignments:{},
        }
    }
    
    //What are the gantts on this page? (so that we can have multiple)
    $('table[data-gantt-id]').each(function(){
        $.ganttdata[$(this).attr('data-gantt-id')] = outline()
        $.ganttdata[$(this).attr('data-gantt-id')].references = outline()

        // adding temporary variable storage
        $.ganttdata[$(this).attr('data-gantt-id')].tmp = {}
    })

    //Process the projects tables
    $('table[data-gantt-role="projects"]').each(function (){
        var id = $(this).attr('data-gantt-id')

        $('thead tr',this).append('<th>Slots Remaining</th>')

        $('tbody tr',this).each(function(){
            $(this).append("<td>0</td>")
            var data = $('td',this)
            $.ganttdata[id].projects[$(data[0]).text()] = {
                color:                  $(data[1]).text(),
                customer:               $(data[2]).text(),
                estimate:      parseInt($(data[3]).text()),
                deadline:               $(data[4]).text(),
                slotsAllotted: parseInt($(data[5]).text()),       
            }
            $.ganttdata[id].references.projects[$(data[0]).text()] = {
                color:               $(data[1]),
                customer:            $(data[2]),
                estimate:            $(data[3]),
                deadline:            $(data[4]),
                slotsAllotted:       $(data[5]) 
            }
            $('td:first-child',this).click({id},selectProject)
        })
    })

    //Process the actual gantt tables
    $('table[data-gantt-role="gantt"]').each(function(){
        var id = $(this).attr('data-gantt-id')
        
        //parse the resources
        $('th',$('thead tr',this)[0]).slice(1).each(function(){
            $.ganttdata[id].resources.push($(this).text())
        })
        
        //parse the timeslots
        $('tbody tr td:first-child',this).each(function(){
            $.ganttdata[id].timeslots.push($(this).text())
        })
        
        //Parse the current assignments
        $('tbody tr',this).each(function(){
            var timeslot = $('td:first-child',this).text()
            var tds = $('td',this).splice(1)

            for(var i=0;i<tds.length;i++){
                var resource = $.ganttdata[id].resources[i]
                var project = $(tds[i]).text()

                if($.ganttdata[id].assignments[timeslot]==undefined){
                    $.ganttdata[id].assignments[timeslot]={}
                }
                
                if($.ganttdata[id].projects[project]!=undefined){
                    $(tds[i]).css('background-color',$.ganttdata[id].projects[project].color)
                }

                $.ganttdata[id].assignments[timeslot][resource]=project
                if($.ganttdata[id].projects[project]!=undefined){
                    $.ganttdata[id].projects[project].slotsAllotted++
                }
                $(tds[i]).click({timeslot,resource,id},toggleAssignment)
            }
        })

        //Output slots remaining
        $('table[data-gantt-role="projects"]').each(function (){
            var id = $(this).attr('data-gantt-id')
            updateSlotsRemaining(id)
        })
    })

    function updateSlotsRemaining(id){
        for(var projectKey in $.ganttdata[id].projects){
            var project = $.ganttdata[id].projects[projectKey]
            var ref = $.ganttdata[id].references.projects[projectKey].slotsAllotted
            var slotsRemaining = project.estimate - project.slotsAllotted

            ref.text(slotsRemaining)
            ref.toggleClass('slotFeedback',slotsRemaining!=0)
        }
    }

    function selectProject(e){
        $.ganttdata[e.data.id].tmp.selectedproject = $(this).text()
        $('table[data-gantt-role="projects"][data-gantt-id="'+e.data.id+'"] td').removeClass('selectedProject')
        $(this).addClass('selectedProject')
    }

    function toggleAssignment(eventdata){
        var timeslot = eventdata.data.timeslot
        var resource = eventdata.data.resource
        var id = eventdata.data.id

        //is a project selected? If not get out of here!
        if($.ganttdata[id].tmp.selectedproject == undefined){
            return
        }

        var table = $(this).closest('table[data-gantt-id]')
        var id = table.attr('data-gantt-id')
        
        var currentProject = $.ganttdata[id].assignments[timeslot][resource]
        var selectedProject = $.ganttdata[id].tmp.selectedproject
  
        if(currentProject == selectedProject){
            $(this).text('')
            $(this).css('background-color','')
            $.ganttdata[id].assignments[timeslot][resource] = '';
            $.ganttdata[id].projects[selectedProject].slotsAllotted--
        }
        else{
            $(this).text(selectedProject)
            $(this).css('background-color', $.ganttdata[id].projects[selectedProject].color)
            $.ganttdata[id].assignments[timeslot][resource] = selectedProject
            if($.ganttdata[id].projects[currentProject]!=undefined){
                $.ganttdata[id].projects[currentProject].slotsAllotted--
            }
            $.ganttdata[id].projects[selectedProject].slotsAllotted++
        }
        updateSlotsRemaining(id)
    }
}
$(function() {
    $.gantt()
})